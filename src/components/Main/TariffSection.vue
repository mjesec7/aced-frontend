<template>
  <section class="pricing-section">
    <div class="container">
      <div class="text-center">
        <div class="sale-badge">🔥 СКИДКА 50% ТОЛЬКО СЕГОДНЯ!</div>
        <h2 class="section-title">Инвестируйте в своё будущее <span class="gradient-text">прямо сейчас!</span></h2>
        <p class="section-subtitle">
          Выберите план, который изменит вашу карьеру навсегда. Каждый сум вернётся увеличением зарплаты!
        </p>
      </div>

      <div class="pricing-cards">
        <div class="card">
          <h3 class="plan-name">Базовый</h3>
          <p class="plan-desc">Для начинающих</p>
          <div class="price-wrapper">
            <p class="old-price">520,000 сум</p>
            <p class="price">260,000 <span class="currency">сум</span></p>
            <p class="period">единовременно</p>
          </div>
          <ul class="features">
            <li><span class="check">✔</span> Доступ ко всем предметам</li>
            <li><span class="check">✔</span> Помощь ИИ с домашкой</li>
            <li><span class="check">✔</span> Прогресс и статистика</li>
          </ul>
           <button class="btn outline" @click="handleClick('start')">Выбрать план</button>
        </div>

        <div class="card popular">
           <div class="popular-badge">⭐ САМЫЙ ПОПУЛЯРНЫЙ</div>
           <h3 class="plan-name">Профессионал</h3>
           <p class="plan-desc">Для карьерного роста</p>
           <div class="price-wrapper">
             <p class="old-price">900,000 сум</p>
             <p class="price">450,000 <span class="currency">сум</span></p>
             <p class="period">единовременно</p>
           </div>
           <div class="economy-badge">ЭКОНОМИЯ 450,000 сум</div>
           <ul class="features">
             <li><span class="check">✔</span> Всё из STARTER +</li>
             <li><span class="check">✔</span> Персональный ИИ-наставник</li>
             <li><span class="check">✔</span> Продвинутая аналитика</li>
             <li><span class="check">✔</span> Индивидуальная карта обучения</li>
           </ul>
            <button class="btn gradient" @click="handleClick('pro')">Начать сейчас!</button>
        </div>

      </div>
    </div>
  </section>
</template>

<script>
import { getAuth } from "firebase/auth";

export default {
  name: 'TariffSection',
  methods: {
    handleClick(plan) {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        window.dispatchEvent(new CustomEvent("open-Login-modal"));
      } else {
        this.$router.push(`/pay/${plan}`);
      }
    }
  }
};
</script>

<style scoped>
.pricing-section {
  padding: 80px 20px;
  background-color: #110d2e;
  font-family: 'Unbounded', sans-serif;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
}
.text-center {
  text-align: center;
  margin-bottom: 4rem;
}
.sale-badge {
  display: inline-block;
  background-color: #ef4444;
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 99px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 2rem;
}
.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 1rem;
}
.gradient-text {
  background: linear-gradient(90deg, #a78bfa, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.section-subtitle {
  font-size: 1.1rem;
  color: #a3a3c2;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
}
.pricing-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  align-items: center;
  max-width: 800px; /* Constrain width for 2 cards */
  margin: 0 auto; /* Center the two cards */
}
.card {
  background-color: #191645;
  border-radius: 1.5rem;
  padding: 2.5rem;
  text-align: center;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.card.popular {
  background: linear-gradient(145deg, #2c1a4d, #191645);
  border: 2px solid #7c3aed;
  position: relative;
  transform: translateY(-20px);
}
.popular-badge {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, #9333ea, #c084fc);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
}
.plan-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
}
.plan-desc {
  font-size: 0.9rem;
  color: #a3a3c2;
  margin-bottom: 2rem;
}
.price-wrapper {
  margin-bottom: 1rem;
}
.old-price {
  font-size: 1.25rem;
  color: #6b7280;
  text-decoration: line-through;
}
.price {
  font-size: 2.5rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
}
.currency {
  font-size: 2rem;
}
.period {
  color: #a3a3c2;
}
.economy-badge {
  display: inline-block;
  background-color: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
  border-radius: 0.5rem;
  padding: 0.5rem;
  margin-top: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
}
.features {
  list-style: none;
  padding: 0;
  margin: 2rem 0;
  text-align: left;
  flex-grow: 1;
}
.features li {
  color: #d1d5db;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.check {
  color: #34d399;
}
.btn {
  width: 100%;
  padding: 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}
.btn.outline {
  background: transparent;
  border: 2px solid #4f46e5;
  color: #a3a3c2;
}
.btn.outline:hover {
  background: #4f46e5;
  color: #fff;
}
.btn.gradient {
  background: linear-gradient(90deg, #9333ea, #7f5af0);
  border: none;
  color: white;
  border: 2px solid transparent;
}
.btn.gradient:hover {
  filter: brightness(1.2);
}

@media (max-width: 680px) {
  .pricing-cards {
    max-width: 100%; /* Allow cards to stack on mobile */
  }
  .card.popular {
    transform: translateY(0); /* Remove vertical shift on mobile stack */
  }
}
</style>