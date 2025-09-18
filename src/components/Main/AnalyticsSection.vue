<template>
  <section class="features-section" id="aced">
    <div class="container">
      <div class="text-center">
        <h2 class="section-title">Почему выбирают ACED?</h2>
        <p class="section-subtitle">
          Мы не просто учим — мы трансформируем карьеры. Каждый элемент нашей
          платформы создан для вашего успеха.
        </p>
      </div>

      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="icon-wrapper" v-html="feature.icon"></div>
          <div class="highlight-badge">{{ feature.highlight }}</div>
          <h3 class="card-title">{{ feature.title }}</h3>
          <p class="card-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AnalyticsSection',
  data() {
    return {
      features: [
        { icon: '🧠', title: 'ИИ-Наставник 24/7', description: 'Персональный AI помощник отвечает на вопросы мгновенно и подстраивается под ваш стиль обучения.', highlight: 'Революционная технология' },
        { icon: '🚀', title: 'Практические проекты', description: 'Создавайте реальные проекты для портфолио. Работайте с настоящими задачами от ведущих компаний.', highlight: '100% практики' },
        { icon: '🏆', title: 'Гарантия трудоустройства', description: '95% наших выпускников находят работу в течение 3 месяцев или мы возвращаем деньги.', highlight: 'Железная гарантия' }
        // You can add the other 3 features here if needed
      ]
    };
  }
};
</script>

<style scoped>
.features-section {
  padding: 80px 20px;
  background-color: #110d2e;
  font-family: 'Unbounded', sans-serif;
}
.container, .text-center, .features-grid {
  max-width: 1200px;
  margin: 0 auto;
}
.text-center {
  text-align: center;
  margin-bottom: 4rem;
}
.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1rem;
}
.section-subtitle {
  font-size: 1.1rem;
  color: #a3a3c2;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
.feature-card {
  background-color: #191645;
  border: 1px solid #2c2c54;
  border-radius: 1rem;
  padding: 2.5rem 2rem;
}
.icon-wrapper {
  font-size: 1.75rem;
  margin-bottom: 2rem;
}
.highlight-badge {
  display: inline-block;
  background: linear-gradient(90deg, #9333ea, #7f5af0);
  color: white;
  padding: 0.3rem 1rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.75rem;
}
.card-description {
  font-size: 1rem;
  color: #d1d5db;
  line-height: 1.7;
  font-weight: 400;
}
</style>