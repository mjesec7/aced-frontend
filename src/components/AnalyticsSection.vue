<template>
    <div class="analytics-container">
      <!-- Left Side: Text Summary -->
      <div class="text-section">
        <h2>Будущее обучения с ACED</h2>
        <p>
          Освойте 40 курсов с поддержкой AI, обучайтесь без границ и развивайтесь в удобном темпе!
        </p>
        <p class="highlight">
          Первые пользователи получают эксклюзивные бонусы!
        </p>
      </div>
  
      <!-- Right Side: Asymmetrical Highlight Cards -->
      <div class="cards-section">
        <div class="highlight-card highlight-1">
          <h3>40+</h3>
          <p>Курсов с AI-помощью</p>
        </div>
        <div class="highlight-card highlight-2">
          <h3>24/7</h3>
          <p>Персонализированная поддержка AI</p>
        </div>
        <div class="highlight-card highlight-3">
          <h3>100%</h3>
          <p>Гибкость и адаптация под вас</p>
        </div>
        <div class="highlight-card highlight-4">
          <h3>Бонусы</h3>
          <p>Ранний доступ к новым возможностям!</p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {};
    },
  };
  </script>
  <style scoped>

  
  /* Container */
  .analytics-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap; /* Позволяет элементам переноситься */
    gap: 40px;
    background: linear-gradient(145deg, #2d0b50, #1a082f);
    color: white;
    padding: 40px;
    margin: 0 auto; /* Центрируем */
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    transition: transform 0.3s ease-in-out;
  }
  
  .analytics-container:hover {
    transform: translateY(-5px);
  }
  
  /* Text Section */
  .text-section {
    flex: 1;
    max-width: 500px;
  }
  
  .text-section h2 {
    font-size: 32px;
  }
  
  .text-section p {
    font-size: 18px;
  }
  
  /* Cards Section */
  .cards-section {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* Две колонки */
    gap: 20px;
    flex: 1;
    min-width: 320px;
  }
  
  /* Individual Cards */
  .highlight-card {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px 18px;
    border-radius: 12px;
    text-align: center;
    width: 400px; /* Фиксированная ширина карточек */
    height: 120px; /* Фиксированная высота */
    box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.4);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    font-size: 16px;
    font-weight: 500;
    color: white;
  }
  
  /* Unique Rotations & Placement */
  .highlight-1 {
    transform: rotate(-5deg);
    background: linear-gradient(145deg, #7b2aff, #a855f7);
  }
  
  .highlight-2 {
    transform: rotate(3deg);
    background: linear-gradient(145deg, #2563eb, #3b82f6);
  }
  
  .highlight-3 {
    transform: rotate(-3deg);
    background: linear-gradient(145deg, #32a852, #76e06e);
  }
  
  .highlight-4 {
    transform: rotate(5deg);
    background: linear-gradient(145deg, #d946ef, #f472b6);
  }
  
  .highlight-card:hover {
    transform: translateY(-5px);
    box-shadow: 0px 8px 18px rgba(0, 0, 0, 0.5);
  }
  
  .highlight-card h3 {
    font-size: 22px;
  }
  
  .highlight-card p {
    font-size: 14px;
  }
</style>  