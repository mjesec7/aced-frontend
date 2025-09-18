<template>
  <section class="great-people-section" ref="section">
    <div class="container">
      <h2 class="section-title">Великие умы, изменившие мир</h2>
      <div class="row-container">
        <div class="scroll-wrapper">
          <div class="scroll-row left-to-right" :class="{ 'paused': !isInView }">
            <div v-for="(person, i) in peopleRow1" :key="'r1'+i" class="person-card">
              <h4>{{ person.name }}</h4>
              <p class="years">{{ person.years }}</p>
              <p class="impact">{{ person.impact }}</p>
              <p class="reason">{{ person.reason }}</p>
            </div>
          </div>
        </div>
        <div class="scroll-wrapper">
          <div class="scroll-row right-to-left" :class="{ 'paused': !isInView }">
            <div v-for="(person, i) in peopleRow2" :key="'r2'+i" class="person-card">
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
    // Data is duplicated here to work with the new CSS animation (translateX(-50%))
    const row1 = [
      { name: 'Исаак Ньютон', years: '1643–1727', impact: 'Физика и математика', reason: 'Сформулировал законы движения и всемирного тяготения' },
      { name: 'Ада Лавлейс', years: '1815–1852', impact: 'Компьютерные науки', reason: 'Написала первый алгоритм для машины' },
      { name: 'Аль-Хорезми', years: 'ок. 780–850', impact: 'Алгебра', reason: 'Основатель алгебры, ввёл арабские цифры в Европу' },
      { name: 'Алан Тьюринг', years: '1912–1954', impact: 'ИИ и вычисления', reason: 'Создал концепцию машины Тьюринга' },
      { name: 'Ибн Сина (Авиценна)', years: '980–1037', impact: 'Медицина', reason: 'Автор «Канона врачебной науки»' },
      { name: 'Галилео Галилей', years: '1564–1642', impact: 'Астрономия', reason: 'Подтвердил гелиоцентризм с помощью телескопа' },
      { name: 'Аль-Фаргани', years: '800–870', impact: 'Астрономия', reason: 'Написал труд о небесных телах, повлиявший на Европу' },
      { name: 'Имам аль-Бухари', years: '810–870', impact: 'Хадисы и история', reason: 'Собрал самый авторитетный сборник хадисов' },
      { name: 'Никола Тесла', years: '1856–1943', impact: 'Электричество', reason: 'Открыл переменный ток и основы радиосвязи' }
    ];
    const row2 = [
      { name: 'Альберт Эйнштейн', years: '1879–1955', impact: 'Физика', reason: 'Создал теорию относительности' },
      { name: 'Мария Кюри', years: '1867–1934', impact: 'Радиоактивность', reason: 'Первая, кто получил две Нобелевские премии' },
      { name: 'Чарльз Дарвин', years: '1809–1882', impact: 'Биология', reason: 'Создал теорию эволюции' },
      { name: 'Карл Саган', years: '1934–1996', impact: 'Популяризация науки', reason: 'Создал цикл "Космос" и писал книги' },
      { name: 'Руми', years: '1207–1273', impact: 'Литература и духовность', reason: 'Его стихи до сих пор вдохновляют' },
      { name: 'Хеди Ламарр', years: '1914–2000', impact: 'Беспроводные технологии', reason: 'Изобрела частотные скачки — основа Bluetooth' },
      { name: 'Роза Паркс', years: '1913–2005', impact: 'Права человека', reason: 'Боролась с расовой дискриминацией в США' },
      { name: 'Ибн Хальдун', years: '1332–1406', impact: 'Социология и экономика', reason: 'Автор «Мукаддимы» — основа общественных наук' },
      { name: 'Гипатия Александрийская', years: 'ок. 360–415', impact: 'Математика и философия', reason: 'Одна из первых женщин-учёных' }
    ];

    return {
      peopleRow1: [...row1, ...row1],
      peopleRow2: [...row2, ...row2],
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
@import url("https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&display=swap");

.great-people-section {
  background-color: #110d2e;
  padding: 80px 0;
  overflow: hidden;
  font-family: 'Unbounded', sans-serif;
}

.container {
  max-width: 1800px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  color: #e0e7ff;
  font-weight: 700;
  margin-bottom: 3rem;
  padding: 0 20px;
}

.row-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.scroll-wrapper {
  overflow: hidden;
}

.scroll-row {
  display: flex;
  gap: 2rem;
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
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes scrollRTL {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}

.person-card {
  width: 320px;
  background: #191645;
  border: 1px solid #2c2c54;
  border-radius: 1rem;
  padding: 1.5rem;
  flex-shrink: 0;
  transition: transform 0.3s ease, border-color 0.3s ease;
  box-sizing: border-box;
}

.person-card:hover {
  transform: scale(1.03) translateY(-5px);
  border-color: #7c3aed;
}

.person-card h4 {
  font-size: 1.2rem;
  color: #fff;
  margin-bottom: 0.25rem;
}

.years {
  font-size: 0.8rem;
  color: #a3a3c2;
  margin-bottom: 1rem;
}

.impact {
  font-size: 1rem;
  color: #c084fc;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.reason {
  font-size: 0.9rem;
  color: #d1d5db;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .section-title {
    font-size: 2rem;
  }
  .person-card {
    width: 280px;
  }
}

@media (max-width: 480px) {
  .great-people-section {
    padding: 60px 0;
  }
  .section-title {
    font-size: 1.5rem;
    margin-bottom: 2rem;
  }
  .scroll-row {
    gap: 1.5rem;
    animation-duration: 100s;
  }
  .person-card {
    width: 240px;
    padding: 1.2rem;
  }
  .person-card h4 {
    font-size: 1.1rem;
  }
}
</style>